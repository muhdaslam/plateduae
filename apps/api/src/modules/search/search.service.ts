import { Injectable } from "@nestjs/common";
import { SearchQueryDto } from "./dto/search-query.dto";
import { SearchResultDto, SuggestResultDto } from "./dto/search-result.dto";

/**
 * Query understanding + retrieval (PDF section 9). Deliberately NOT
 * implemented in this scaffolding pass — real behaviour is: classify query
 * intent (dish/cuisine/venue/attribute), expand against the canonical
 * taxonomy, geo pre-filter, hybrid BM25 + vector retrieval over OpenSearch.
 * Runs as a cached deterministic service, never an LLM call in the request
 * path (section 6 design decision).
 */
@Injectable()
export class SearchService {
  async search(_query: SearchQueryDto): Promise<SearchResultDto> {
    return { items: [], cursor: null };
  }

  async suggest(_q: string): Promise<SuggestResultDto[]> {
    return [];
  }
}
