import { MongoClient, Db, Collection, ObjectId, Filter, Document } from 'mongodb';
import logger from '../utils/logger';

const url = process.env.DATABASE_URL || '';
const useMemoryDb = !url || url.trim() === '' || url.includes('memory') || url.includes('mock');

const dbName = (() => {
  if (useMemoryDb) return 'inmemory';
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\//, '');
    return path || 'linkedinbot';
  } catch {
    return 'linkedinbot';
  }
})();

const client = useMemoryDb ? null : new MongoClient(url);
let db: Db;

export const connect = async (): Promise<any> => {
  if (useMemoryDb) {
    logger.info('Database running in-memory mode (MongoDB optional)');
    return null;
  }
  if (db) return db;
  if (!client) throw new Error('MongoClient is not initialized');
  await client.connect();
  db = client.db(dbName);
  await ensureIndexes(db);
  return db;
};

export const disconnect = async () => {
  if (useMemoryDb) return;
  if (client) {
    await client.close();
  }
};

const ensureIndexes = async (database: Db) => {
  try {
    await database.collection('news_articles').createIndex({ url: 1 }, { unique: true });
    await database.collection('news_articles').createIndex({ used: 1, fetchedAt: -1 });
    await database.collection('drafts').createIndex({ status: 1, createdAt: -1 });
    await database.collection('posts').createIndex({ draftId: 1 }, { unique: true });
    await database.collection('posts').createIndex({ postedAt: -1 });
    await database.collection('post_metrics').createIndex({ postId: 1, recordedAt: -1 });
    await database.collection('prompt_insights').createIndex({ generatedAt: -1 });
    await database.collection('settings').createIndex({ key: 1 }, { unique: true });
    await database.collection('job_logs').createIndex({ jobType: 1, executedAt: -1 });
  } catch (err) {
    logger.warn('Index creation warning:', err);
  }
};

// ---- helpers -----------------------------------------------------------

const toObjectId = (id: string | ObjectId): ObjectId => {
  if (id instanceof ObjectId) return id;
  return new ObjectId(id);
};

const serialize = <T extends Document>(doc: T | null): any => {
  if (!doc) return null;
  const out: any = { ...doc };
  if (out._id) {
    out.id = out._id instanceof ObjectId ? out._id.toString() : String(out._id);
    delete out._id;
  }
  return out;
};

const translateWhere = (where: any = {}): Filter<any> => {
  const filter: any = {};
  for (const [k, v] of Object.entries(where)) {
    if (k === 'id') {
      filter._id = typeof v === 'string' ? toObjectId(v) : v;
    } else if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      const ops: any = {};
      for (const [op, val] of Object.entries(v as any)) {
        if (op === 'not') ops.$ne = val;
        else if (op === 'gte') ops.$gte = val;
        else if (op === 'lte') ops.$lte = val;
        else if (op === 'gt') ops.$gt = val;
        else if (op === 'lt') ops.$lt = val;
        else if (op === 'in') ops.$in = val;
        else ops[`$${op}`] = val;
      }
      filter[k] = ops;
    } else {
      filter[k] = v;
    }
  }
  return filter;
};

const translateOrderBy = (orderBy: any = {}): any => {
  if (!orderBy) return {};
  const sort: any = {};
  for (const [k, v] of Object.entries(orderBy)) {
    sort[k] = v === 'asc' ? 1 : -1;
  }
  return sort;
};

const matchDocument = (doc: any, where: any = {}): boolean => {
  for (const [k, v] of Object.entries(where)) {
    let docVal = doc[k];
    if (k === 'id') {
      docVal = doc.id;
    }

    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      for (const [op, val] of Object.entries(v as any)) {
        if (op === 'not') {
          if (docVal === val) return false;
        } else if (op === 'gte') {
          const dateA = docVal instanceof Date ? docVal.getTime() : new Date(docVal).getTime();
          const dateB = (val as any) instanceof Date ? (val as any).getTime() : new Date(val as any).getTime();
          if (!isNaN(dateA) && !isNaN(dateB)) {
            if (!(dateA >= dateB)) return false;
          } else if (!(docVal >= (val as any))) return false;
        } else if (op === 'lte') {
          const dateA = docVal instanceof Date ? docVal.getTime() : new Date(docVal).getTime();
          const dateB = (val as any) instanceof Date ? (val as any).getTime() : new Date(val as any).getTime();
          if (!isNaN(dateA) && !isNaN(dateB)) {
            if (!(dateA <= dateB)) return false;
          } else if (!(docVal <= (val as any))) return false;
        } else if (op === 'gt') {
          const dateA = docVal instanceof Date ? docVal.getTime() : new Date(docVal).getTime();
          const dateB = (val as any) instanceof Date ? (val as any).getTime() : new Date(val as any).getTime();
          if (!isNaN(dateA) && !isNaN(dateB)) {
            if (!(dateA > dateB)) return false;
          } else if (!(docVal > (val as any))) return false;
        } else if (op === 'lt') {
          const dateA = docVal instanceof Date ? docVal.getTime() : new Date(docVal).getTime();
          const dateB = (val as any) instanceof Date ? (val as any).getTime() : new Date(val as any).getTime();
          if (!isNaN(dateA) && !isNaN(dateB)) {
            if (!(dateA < dateB)) return false;
          } else if (!(docVal < (val as any))) return false;
        } else if (op === 'in') {
          if (!Array.isArray(val) || !(val as any).includes(docVal)) return false;
        }
      }
    } else {
      if (docVal !== v) return false;
    }
  }
  return true;
};

const sortResults = (results: any[], orderBy: any): any[] => {
  const sorted = [...results];
  for (const [k, v] of Object.entries(orderBy)) {
    const direction = v === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      const valA = a[k];
      const valB = b[k];
      if (valA instanceof Date && valB instanceof Date) {
        return (valA.getTime() - valB.getTime()) * direction;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * direction;
      }
      return (valA < valB ? -1 : valA > valB ? 1 : 0) * direction;
    });
  }
  return sorted;
};

// ---- generic repository -------------------------------------------------

interface FindArgs {
  where?: any;
  orderBy?: any;
  take?: number;
  skip?: number;
  include?: Record<string, boolean | any>;
}

class Repo<T extends { id?: string } = any> {
  constructor(
    private collectionName: string,
    private include?: (doc: any) => Promise<any>,
  ) {}

  private col(): Collection {
    return db.collection(this.collectionName);
  }

  async findUnique(args: { where: any; include?: any }): Promise<T | null> {
    const doc = await this.col().findOne(translateWhere(args.where));
    const serialized = serialize(doc);
    if (serialized && args.include && this.include) return this.include(serialized);
    return serialized;
  }

  async findFirst(args: { where?: any; orderBy?: any; include?: any } = {}): Promise<T | null> {
    const cursor = this.col().find(translateWhere(args.where));
    if (args.orderBy) cursor.sort(translateOrderBy(args.orderBy));
    const doc = await cursor.limit(1).next();
    const serialized = serialize(doc);
    if (serialized && args.include && this.include) return this.include(serialized);
    return serialized;
  }

  async findMany(args: FindArgs = {}): Promise<T[]> {
    const cursor = this.col().find(translateWhere(args.where));
    if (args.orderBy) cursor.sort(translateOrderBy(args.orderBy));
    if (args.skip) cursor.skip(args.skip);
    if (args.take) cursor.limit(args.take);
    const docs = await cursor.toArray();
    const serialized = docs.map(serialize);
    if (args.include && this.include) {
      return Promise.all(serialized.map((d: any) => this.include!(d)));
    }
    return serialized;
  }

  async count(args: { where?: any } = {}): Promise<number> {
    return this.col().countDocuments(translateWhere(args.where));
  }

  async create(args: { data: any }): Promise<T> {
    const data: any = { ...args.data };
    for (const key of Object.keys(data)) {
      if (key.endsWith('Id') && typeof data[key] === 'string' && ObjectId.isValid(data[key])) {
        data[key] = toObjectId(data[key]);
      }
    }
    if (!data.createdAt && this.hasField('createdAt')) data.createdAt = new Date();
    const res = await this.col().insertOne(data);
    const inserted = await this.col().findOne({ _id: res.insertedId });
    return serialize(inserted);
  }

  async update(args: { where: any; data: any }): Promise<T> {
    const filter = translateWhere(args.where);
    const data: any = { ...args.data };
    for (const key of Object.keys(data)) {
      if (key.endsWith('Id') && typeof data[key] === 'string' && ObjectId.isValid(data[key])) {
        data[key] = toObjectId(data[key]);
      }
    }
    if (this.hasField('updatedAt')) data.updatedAt = new Date();
    await this.col().updateOne(filter, { $set: data });
    const updated = await this.col().findOne(filter);
    return serialize(updated);
  }

  async delete(args: { where: any }): Promise<T> {
    const filter = translateWhere(args.where);
    const doc = await this.col().findOne(filter);
    await this.col().deleteOne(filter);
    return serialize(doc);
  }

  private hasField(_: string): boolean {
    return true;
  }
}

// ---- in-memory repository -----------------------------------------------

class InMemoryRepo<T extends { id?: string } = any> {
  private static store: Record<string, any[]> = {};

  constructor(
    private collectionName: string,
    private include?: (doc: any) => Promise<any>,
  ) {
    if (!InMemoryRepo.store[collectionName]) {
      InMemoryRepo.store[collectionName] = [];
    }
  }

  private get items(): any[] {
    return InMemoryRepo.store[this.collectionName];
  }

  private set items(val: any[]) {
    InMemoryRepo.store[this.collectionName] = val;
  }

  async findUnique(args: { where: any; include?: any }): Promise<T | null> {
    const item = this.items.find(doc => matchDocument(doc, args.where));
    if (!item) return null;
    const cloned = JSON.parse(JSON.stringify(item));
    // Rehydrate Dates
    this.rehydrateDates(cloned);
    if (args.include && this.include) return this.include(cloned);
    return cloned;
  }

  async findFirst(args: { where?: any; orderBy?: any; include?: any } = {}): Promise<T | null> {
    let results = this.items.filter(doc => matchDocument(doc, args.where));
    if (args.orderBy) {
      results = sortResults(results, args.orderBy);
    }
    const item = results[0] || null;
    if (!item) return null;
    const cloned = JSON.parse(JSON.stringify(item));
    this.rehydrateDates(cloned);
    if (args.include && this.include) return this.include(cloned);
    return cloned;
  }

  async findMany(args: FindArgs = {}): Promise<T[]> {
    let results = this.items.filter(doc => matchDocument(doc, args.where));
    if (args.orderBy) {
      results = sortResults(results, args.orderBy);
    }
    if (args.skip) {
      results = results.slice(args.skip);
    }
    if (args.take) {
      results = results.slice(0, args.take);
    }
    const cloned = JSON.parse(JSON.stringify(results));
    cloned.forEach((item: any) => this.rehydrateDates(item));
    if (args.include && this.include) {
      return Promise.all(cloned.map((d: any) => this.include!(d)));
    }
    return cloned;
  }

  async count(args: { where?: any } = {}): Promise<number> {
    return this.items.filter(doc => matchDocument(doc, args.where)).length;
  }

  async create(args: { data: any }): Promise<T> {
    const data = JSON.parse(JSON.stringify(args.data));
    if (!data.id) {
      data.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    if (!data.createdAt) {
      data.createdAt = new Date().toISOString();
    }
    this.items.push(data);
    const cloned = JSON.parse(JSON.stringify(data));
    this.rehydrateDates(cloned);
    return cloned;
  }

  async update(args: { where: any; data: any }): Promise<T> {
    const index = this.items.findIndex(doc => matchDocument(doc, args.where));
    if (index === -1) throw new Error('Document not found for update');
    const existing = this.items[index];
    const updated = { ...existing, ...JSON.parse(JSON.stringify(args.data)), updatedAt: new Date().toISOString() };
    this.items[index] = updated;
    const cloned = JSON.parse(JSON.stringify(updated));
    this.rehydrateDates(cloned);
    return cloned;
  }

  async delete(args: { where: any }): Promise<T> {
    const index = this.items.findIndex(doc => matchDocument(doc, args.where));
    if (index === -1) throw new Error('Document not found for delete');
    const doc = this.items[index];
    this.items.splice(index, 1);
    const cloned = JSON.parse(JSON.stringify(doc));
    this.rehydrateDates(cloned);
    return cloned;
  }

  private rehydrateDates(item: any) {
    if (!item) return;
    for (const key of Object.keys(item)) {
      if (typeof item[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(item[key])) {
        item[key] = new Date(item[key]);
      }
    }
  }
}

// ---- relation hydrators -------------------------------------------------

const hydrateDraft = async (draft: any): Promise<any> => {
  if (!draft) return draft;
  const article = draft.articleId
    ? await dbClient.newsArticle.findUnique({ where: { id: String(draft.articleId) } })
    : null;
  const post = await dbClient.post.findUnique({ where: { draftId: String(draft.id) } });
  return { ...draft, article, post };
};

const hydratePost = async (post: any): Promise<any> => {
  if (!post) return post;
  const draftRaw = post.draftId
    ? await dbClient.draft.findUnique({ where: { id: String(post.draftId) } })
    : null;
  const draft = draftRaw ? await hydrateDraft(draftRaw) : null;
  return { ...post, draft };
};

// ---- public client ------------------------------------------------------

const dbClient = {
  newsArticle: useMemoryDb ? new InMemoryRepo('news_articles') : new Repo('news_articles'),
  draft: useMemoryDb ? new InMemoryRepo('drafts', hydrateDraft) : new Repo('drafts', hydrateDraft),
  post: useMemoryDb ? new InMemoryRepo('posts', hydratePost) : new Repo('posts', hydratePost),
  settings: useMemoryDb ? new InMemoryRepo('settings') : new Repo('settings'),
  postMetric: useMemoryDb ? new InMemoryRepo('post_metrics') : new Repo('post_metrics'),
  promptInsight: useMemoryDb ? new InMemoryRepo('prompt_insights') : new Repo('prompt_insights'),
  jobLog: useMemoryDb ? new InMemoryRepo('job_logs') : new Repo('job_logs'),
  $connect: connect,
  $disconnect: disconnect,
  raw: () => db,
};

export default dbClient;
