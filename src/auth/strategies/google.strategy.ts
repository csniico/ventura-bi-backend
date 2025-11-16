import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { VerifiedCallback } from "passport-jwt";
import { GoogleUserProfileResponsePayload } from "types/google-profile";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
            callbackURL: configService.get<string>('GOOGLE_OAUTH_REDIRECT_URL', ''),
            scope: ['email', 'profile'],
        })
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: GoogleUserProfileResponsePayload,
        done: VerifiedCallback
    ) {
        if (!profile) {
            return done(new UnauthorizedException(), false);
        }

        const {
            sub: googleId,
            email,
            given_name: firstName,
            family_name: lastName,
            picture: avatarUrl
        } = profile._json;

        const user = await this.authService.validateGoogleUser({
            googleId, email, firstName, lastName, avatarUrl, password: ""
        });
        done(null, user);

    }
}