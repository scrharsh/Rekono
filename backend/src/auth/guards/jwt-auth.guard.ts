import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { SKIP_SUBSCRIPTION_KEY } from '../decorators/skip-subscription.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	constructor(
		private readonly reflector: Reflector,
		private readonly authService: AuthService,
	) {
		super();
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const can = (await super.canActivate(context)) as boolean;
		if (!can) {
			return false;
		}

		const shouldSkip = this.reflector.getAllAndOverride<boolean>(SKIP_SUBSCRIPTION_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (shouldSkip) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const userId = request?.user?.userId;
		if (!userId) {
			return true;
		}

		await this.authService.ensureSubscribedUser(userId);
		return true;
	}
}
