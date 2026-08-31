//Session
export interface GeofenceTraccar {
    name: string;
    area: string;
    description?: string;
    calendarId?: number;
    attributes?: Record<string, unknown>;
}


export interface SessionTraccar {

    email: string,
    password: string


}

export interface DeviceTraccar {
    uniqueId: string;
    name: string;
    groupId?: number;
    phone?: string;
    model?: string;
    contact?: string;
    category?: string;
    disabled?: boolean;
    attributes?: Record<string, unknown>;
}
