export interface PostResult {
  success: boolean;
  url?: string;
  urn?: string;
  error?: string;
}

export interface ILinkedInPoster {
  post(content: string): Promise<PostResult>;
  testConnection(): Promise<boolean>;
}
