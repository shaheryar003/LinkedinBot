import axios from 'axios';
import { ILinkedInPoster, PostResult } from './linkedin-poster.interface';
import logger from '../utils/logger';

class LinkedInAPIPoster implements ILinkedInPoster {
  private accessToken: string | null = null;
  private organizationId: string | null = null;

  constructor() {
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN || null;
    this.organizationId = process.env.LINKEDIN_ORGANIZATION_ID || null;
  }

  setCredentials(accessToken: string, organizationId: string): void {
    this.accessToken = accessToken;
    this.organizationId = organizationId;
  }

  async post(content: string): Promise<PostResult> {
    try {
      if (!this.accessToken || !this.organizationId) {
        throw new Error('LinkedIn API credentials not configured');
      }

      logger.info('Posting to LinkedIn via API');

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: `urn:li:organization:${this.organizationId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (response.status === 201) {
        const postId = response.data.id;
        const postUrl = `https://www.linkedin.com/feed/update/${postId}`;
        logger.info(`Post created successfully via API: ${postUrl}`);
        return { success: true, url: postUrl, urn: postId };
      }

      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error: any) {
      logger.error('Error posting via LinkedIn API:', error);

      if (error.response) {
        logger.error('API Error Response:', error.response.data);
        return {
          success: false,
          error: `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        };
      }

      return { success: false, error: String(error) };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.accessToken) {
        logger.error('LinkedIn API access token not configured');
        return false;
      }

      logger.info('Testing LinkedIn API connection');

      // Test by fetching user profile
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.status === 200) {
        logger.info('LinkedIn API connection successful');
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('LinkedIn API connection test failed:', error);
      if (error.response) {
        logger.error('API Error:', error.response.data);
      }
      return false;
    }
  }

  async refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string | null> {
    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        logger.info('Access token refreshed successfully');
        return response.data.access_token;
      }

      return null;
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      return null;
    }
  }
}

export default LinkedInAPIPoster;
