import { Audio } from 'expo-av';

export async function playClick() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: '' },
      { volume: 0.3 }
    );
    await sound.replayAsync();
  } catch {}
}

export async function playWin() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: '' },
      { volume: 0.5 }
    );
    await sound.replayAsync();
  } catch {}
}

export async function playLose() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: '' },
      { volume: 0.5 }
    );
    await sound.replayAsync();
  } catch {}
}
