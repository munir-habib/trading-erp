import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "attachments";

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase Storage ainda não está configurado — falta SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    );
    this.name = "StorageNotConfiguredError";
  }
}

function isConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!url && !!key && !key.startsWith("[YOUR-");
}

function getServiceRoleClient() {
  if (!isConfigured()) throw new StorageNotConfiguredError();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export function isStorageConfigured() {
  return isConfigured();
}

export async function uploadToStorage(
  path: string,
  file: Buffer,
  contentType: string,
) {
  const client = getServiceRoleClient();
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getSignedUrl(path: string, expiresInSeconds = 3600) {
  const client = getServiceRoleClient();
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFromStorage(path: string) {
  const client = getServiceRoleClient();
  const { error } = await client.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
