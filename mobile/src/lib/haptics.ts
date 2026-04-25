import * as Haptics from "expo-haptics";

export async function successHaptic() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

