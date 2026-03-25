import axios from 'axios';

export const api = axios.create({
    // baseURL: 'https://j14a207.p.ssafy.io//api/v1' /*android studio 기반 베이스 주소*/,
    baseURL: 'http://localhost:8080/api', /* 로컬 백엔드 주소로 임시 변경 */
    timeout: 5000,
    headers: {
        'content-type': 'application/json',
    },
});
