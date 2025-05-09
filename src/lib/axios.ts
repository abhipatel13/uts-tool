import axios from "axios";
import https from 'https';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  // Only disable SSL verification in development
  ...(process.env.NODE_ENV === 'development' && {
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  })
});

export default instance; 