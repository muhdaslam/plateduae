import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { SearchQueryDto } from "./dto/search-query.dto";
import { SearchResultDto, SuggestResultDto } from "./dto/search-result.dto";

// @nestjs/swagger cannot expand a @Query() DTO into individual OpenAPI
// query parameters on its own (no CLI plugin support for that on GET
// routes) — without these, the generated openapi.json shows no query
// params at all for a route, which then makes @plated/api-client generate
// a client that can't type a query call. Kept in sync with SearchQueryDto
// by hand; a mismatch here only affects the generated docs/types, not
// runtime validation (class-validator on the DTO still does that).
@ApiTags("search")
@Controller("v1")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get("search")
  @ApiOperation({ summary: "Dish search: text/cuisine/venue intent, geo-filtered and ranked." })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "lat", required: false, type: Number })
  @ApiQuery({ name: "lng", required: false, type: Number })
  @ApiQuery({ name: "radius", required: false, type: Number })
  @ApiQuery({ name: "filters", required: false, type: String })
  @ApiQuery({ name: "sort", required: false, enum: ["relevance", "price_asc", "price_desc", "distance"] })
  @ApiQuery({ name: "cursor", required: false, type: String })
  @ApiOkResponse({ type: SearchResultDto })
  search(@Query() query: SearchQueryDto): Promise<SearchResultDto> {
    return this.searchService.search(query);
  }

  @Get("suggest")
  @ApiOperation({ summary: "Type-ahead over canonical dishes, cuisines and venues." })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiOkResponse({ type: [SuggestResultDto] })
  suggest(@Query("q") q?: string): Promise<SuggestResultDto[]> {
    return this.searchService.suggest(q ?? "");
  }
}
