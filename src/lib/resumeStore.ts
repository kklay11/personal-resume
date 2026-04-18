import type { Session, User } from '@supabase/supabase-js';
import { CURRENT_RESUME_SCHEMA_VERSION } from './resumeData';
import { isSupabaseConfigured, supabase } from './supabase';
import type { ResumeData, ResumeSummary } from '../types';

interface ResumeRow {
  id: string;
  title: string;
  content_json: ResumeData;
  schema_version: number;
  updated_at: string;
  last_opened_at: string | null;
}

const assertSupabase = () => {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase 未配置，请先设置环境变量。');
  }

  return supabase;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const session = await getCurrentSession();
  return session?.user ?? null;
};

export const signInWithPassword = async (email: string, password: string) => {
  const client = assertSupabase();
  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
};

export const signUpWithPassword = async (email: string, password: string) => {
  const client = assertSupabase();
  const { error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }
};

export const signOut = async () => {
  const client = assertSupabase();
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
};

export const listResumes = async (): Promise<ResumeSummary[]> => {
  const client = assertSupabase();
  const { data, error } = await client
    .from('resumes')
    .select('id,title,updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    updatedAt: item.updated_at,
  }));
};

export const getResume = async (id: string): Promise<ResumeRow | null> => {
  const client = assertSupabase();
  const { data, error } = await client
    .from('resumes')
    .select('id,title,content_json,schema_version,updated_at,last_opened_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const createResume = async (initialData: ResumeData, title: string) => {
  const client = assertSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('请先登录后再创建云端简历。');
  }

  const { data, error } = await client
    .from('resumes')
    .insert({
      user_id: user.id,
      title,
      content_json: initialData,
      schema_version: CURRENT_RESUME_SCHEMA_VERSION,
      last_opened_at: new Date().toISOString(),
    })
    .select('id,title,updated_at')
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    updatedAt: data.updated_at,
  } satisfies ResumeSummary;
};

export const updateResume = async (
  id: string,
  contentJson: ResumeData,
  title: string,
  schemaVersion: number,
) => {
  const client = assertSupabase();
  const { error } = await client
    .from('resumes')
    .update({
      title,
      content_json: contentJson,
      schema_version: schemaVersion,
      updated_at: new Date().toISOString(),
      last_opened_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const deleteResume = async (id: string) => {
  const client = assertSupabase();
  const { error } = await client.from('resumes').delete().eq('id', id);

  if (error) {
    throw error;
  }
};
