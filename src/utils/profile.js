import { fetchBusinessProfile, saveBusinessProfile } from "../api.js";

export async function getProfile() {
  try {
    return await fetchBusinessProfile();
  } catch {
    return null;
  }
}

export async function saveProfile(profile) {
  return saveBusinessProfile(profile);
}
