import axios from 'axios';

export const api = axios.create({
    baseURL: 'https://j14a207.p.ssafy.io//api/v1' /*android studio 기반 베이스 주소*/,
    timeout: 5000,
    headers: {
        'content-type': 'application/json',
    },
});
