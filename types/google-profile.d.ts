type ResponsePayloadNameProperty = {
    familyName: string | undefined;
    givenName: string;
}

type ResponsePayloadEmailsList = {
    value: string;
    verified: boolean;
}

type ResponsePayloadPhotosList = {
    value: string;
}

type ResponsePayloadJson = {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
}

export type GoogleUserProfileResponsePayload = {
    id: string;
    displayName: string;
    name: ResponsePayloadNameProperty;
    emails: ResponsePayloadEmailsList[],
    photos: ResponsePayloadPhotosList[],
    provider: 'google',
    _raw: string;
    _json: ResponsePayloadJson;
}