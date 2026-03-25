import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://j14a207.p.ssafy.io/api',
    timeout: 5000,
    headers: {
        'content-type': 'application/json',
    },
});
