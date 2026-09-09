import { Injectable } from "@nestjs/common";
import { SavedResponseDto } from "./dto/saved.dto";

/**
 * User, alerts, saved items (PDF section 6 application plane). Owns
 * app_user reads/writes for the lightweight MVP auth scope (saved dishes
 * only, per section 4.1) and price-drop / new-dish alert configuration
 * (anchor user story 5). Auth itself is not wired in this pass — see
 * non-scope in the plan.
 */
@Injectable()
export class UserAlertsService {
  async getSaved(): Promise<SavedResponseDto> {
    return { savedDishes: [] };
  }
}
