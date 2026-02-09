import axios from 'axios';

const VEO_ENDPOINT = 'https://veo.googleapis.com/v1/videos';

export async function generateVideo({ prompt, duration, fps, resolution }) {
  const payload = {
    prompt,
    durationSeconds: duration,
    fps,
    resolution
  };

  const response = await axios.post(VEO_ENDPOINT, payload);
  return response.data;
}
