import {api} from "./axios";

interface AreaItem {
    boothId: number;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
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

    getBoothMap: (eventId: number) => {
        return api.get(`/v1/boothmaps/events/${eventId}`);
    },

    updateBoothMapAreas: (eventId: number, eventMapId: number, areas: AreaItem[]) => {
        return api.put(`/v1/boothmaps/events/${eventId}/areas/bulk`, {
            eventMapId,
            areas,
        });
    },

    updateBoothMapSnapshot: (eventId: number, eventMapId: number, snapshot: any) => {
        return api.put(`/v1/boothmaps/events/${eventId}/snapshot`, {
            eventMapId,
            mappingSnapshot: JSON.stringify(snapshot),
        });
    }
};
