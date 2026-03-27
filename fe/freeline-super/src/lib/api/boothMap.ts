import {api} from "./axios";
import type {ApiResponse} from "./event";

export interface AreaItem {
    boothId: number;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
}

export interface EditorAreaItem {
    boothId: number | null;
    boothName?: string;
    locationCode?: string;
    waitingCount?: number;
    estimatedWaitTime?: number;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
    localId: string;
}

// [NEW] 지도 조회 응답에 맞춘 부스 영역 타입
export interface BoothMapAreaInfo {
    areaId: number;
    boothId: number;
    boothName: string;
    locationCode: string;
    waitingCount: number;
    estimatedWaitTime: number;
    isEmergencyClosed: boolean;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
}

// [NEW] AI 분석 초안 좌표 타입
export interface BoothAreaDraft {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
}

// [NEW] 부스 지도 조회 응답 타입
export interface BoothMapResponse {
    eventId: number;
    eventMapId: number;
    mapImageUrl: string;
    booths: BoothMapAreaInfo[];
    drafts: BoothAreaDraft[];
}

export interface BoothMapSnapshot {
    areas: EditorAreaItem[];
}

export const boothMapApi = {
    uploadMapImage: (eventId: number, file: File, isVisible: boolean = true) => {
        const formData = new FormData();
        formData.append("file", file);

        return api.post(`/v1/boothmaps/events/${eventId}/image?isVisible=${isVisible}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },

    // [MODIFIED] waitingCount, estimatedWaitTime까지 타입 안전하게 수신한다.
    getBoothMap: (eventId: number) => {
        return api.get<ApiResponse<BoothMapResponse>>(`/v1/boothmaps/events/${eventId}`);
    },

    updateBoothMapAreas: (eventId: number, eventMapId: number, areas: AreaItem[]) => {
        return api.put(`/v1/boothmaps/events/${eventId}/areas/bulk`, {
            eventMapId,
            areas,
        });
    },

    updateBoothMapSnapshot: (eventId: number, eventMapId: number, snapshot: BoothMapSnapshot) => {
        return api.put(`/v1/boothmaps/events/${eventId}/snapshot`, {
            eventMapId,
            mappingSnapshot: JSON.stringify(snapshot.areas),
        });
    },
};
