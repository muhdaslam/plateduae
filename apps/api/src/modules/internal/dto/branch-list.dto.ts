import { ApiProperty } from "@nestjs/swagger";

/** Backs the venue picker on the menu-upload page. Not part of Appendix
 * A's consumer API surface (no public "list venues" endpoint exists) —
 * this exists specifically to support the admin-ish upload flow, which
 * has no restaurant-owner auth/session yet to scope it to "your own
 * venues" (auth is explicitly out of scope for this pass). */
export class BranchListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() restaurantName!: string;
  @ApiProperty() address!: string;
  @ApiProperty() community!: string;
}
