import {api} from "./axios";

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
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
    localId: string;
}

export interface BoothMapSnapshot {
    areas: EditorAreaItem[];
}

export interface BoothMapAreaResponse {
    areaId?: number;
    boothId: number;
    boothName: string;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
}

export interface BoothAreaDraftResponse {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
}

export interface BoothMapResponse {
    eventId: number;
    eventMapId: number;
    mapImageUrl: string | null;
    mappingSnapshot?: string | null;
    booths?: BoothMapAreaResponse[];
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export const boothMapApi = {
    uploadMapImage: (eventId: number, file: File, isVisible: boolean = true) => {
        const formData = new FormData();
        formData.append("file", file);

        return api.post<ApiResponse<{
            eventMapId: number;
            eventId: number;
            imagePath: string;
            isVisible: boolean;
            drafts?: BoothAreaDraftResponse[];
        }>>(`/v1/boothmaps/events/${eventId}/image?isVisible=${isVisible}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },

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
            mappingSnapshot: JSON.stringify(snapshot),
        });
    },
};
