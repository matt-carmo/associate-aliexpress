import axios from 'axios';
import {config} from '../config/bot';

export const sendPhoto = async ({chatId, photoUrl, text}: {chatId: number, photoUrl: string, text: string}) => {
  
  const url = `https://api.telegram.org/bot${config.botToken}/sendPhoto`;

  return axios.post(url, {
    chat_id: chatId,
    photo: photoUrl,
    parse_mode: 'HTML',
    caption: text
  });
};
