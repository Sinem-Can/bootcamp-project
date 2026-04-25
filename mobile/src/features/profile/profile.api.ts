import { apiFetch } from "../../lib/api";

export type UserProfileUpdateRequest = {
  allergens: string[];
  diet: string | null;
  undesired: string[];
};

export type UserProfileResponse = UserProfileUpdateRequest;

export async function updateProfile(payload: UserProfileUpdateRequest) {
  return apiFetch<UserProfileResponse>("/user/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

