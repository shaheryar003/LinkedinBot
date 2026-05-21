import { MongoClient, Db, Collection, ObjectId, Filter, Document } from 'mongodb';
import logger from '../utils/logger';

const url = process.env.DATABASE_URL || 'mongodb://localhost:27017/linkedinbot';
const dbName = (() => {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\//, '');
    return path || 'linkedinbot';
  } catch {
    return 'linkedinbot';
  }
})();

const client = new MongoClient(url);
let db: Db;

export const connect = async (): Promise<Db> => {
  if (db) return db;
  await client.connect();
  db = client.db(dbName);
  await ensureIndexes(db);
  return db;
};

export const disconnect = async () => {
  await client.close();
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
    // Convert foreign-key id fields if they look like ObjectIds
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

// ---- relation hydrators -------------------------------------------------

const hydrateDraft = async (draft: any): Promise<any> => {
  if (!draft) return draft;
  const article = draft.articleId
    ? serialize(await db.collection('news_articles').findOne({ _id: toObjectId(draft.articleId) }))
    : null;
  const post = serialize(await db.collection('posts').findOne({ draftId: toObjectId(draft.id) }));
  return { ...draft, article, post };
};

const hydratePost = async (post: any): Promise<any> => {
  if (!post) return post;
  const draftRaw = post.draftId
    ? serialize(await db.collection('drafts').findOne({ _id: toObjectId(post.draftId) }))
    : null;
  const draft = draftRaw ? await hydrateDraft(draftRaw) : null;
  return { ...post, draft };
};

// ---- public client ------------------------------------------------------

const dbClient = {
  newsArticle: new Repo('news_articles'),
  draft: new Repo('drafts', hydrateDraft),
  post: new Repo('posts', hydratePost),
  settings: new Repo('settings'),
  postMetric: new Repo('post_metrics'),
  promptInsight: new Repo('prompt_insights'),
  jobLog: new Repo('job_logs'),
  $connect: connect,
  $disconnect: disconnect,
  raw: () => db,
};

export default dbClient;
