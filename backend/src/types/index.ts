//Session
export interface UserTraccar {
    name: string;
    email: string;
    password?: string;
    phone?: string | null;
    readonly?: boolean;
    administrator?: boolean;
    map?: string | null;
    latitude?: number;
    longitude?: number;
    zoom?: number;
    coordinateFormat?: string | null;
    disabled?: boolean;
    expirationTime?: string | null;
    deviceLimit?: number;
    userLimit?: number;
    deviceReadonly?: boolean;
    limitCommands?: boolean;
    fixedEmail?: boolean;
    poiLayer?: string | null;
    attributes?: Record<string, unknown>;
}

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
