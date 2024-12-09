import { sendPhoto } from '@/app/services/sendPhoto';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { chatId, photoUrl, caption } = req.body;

    if (!chatId || !photoUrl) {
      return res.status(400).json({ error: 'chatId and photoUrl are required' });
    }

    try {
      await sendPhoto(chatId, photoUrl, caption);
      res.status(200).json({ message: 'Photo sent successfully!' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send photo' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
