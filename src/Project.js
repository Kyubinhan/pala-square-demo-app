import React, { useCallback } from "react";
import { useQueryParam, StringParam } from "use-query-params";
import { useInfiniteQuery, useQuery } from "react-query";
import { Link } from "react-router-dom";

const projectContractAddress = "0x22D28b7E69eb45FDEaaf7B57161A53d94c648cAf";
const baseUrl = "https://api.pala.world/tokens";

const getItemsUrl = (pageNumber) =>
  `${baseUrl}` +
  `?project_contract_address=${projectContractAddress}` +
  "&order_by=listPriceInKlay.asc" +
  "&wallet_address=0x0000000000000000000000000000000000000000" +
  `&limit=20&page=${pageNumber}`;

const fetchItems = ({ pageParam = 1, meta }) => {
  const url = getItemsUrl(pageParam);
  return fetch(url).then((res) => res.json());
};

const itemSearchUrl = (itemNumber) =>
  `${baseUrl}/${projectContractAddress}/${itemNumber}` +
  "?wallet_address=0x0000000000000000000000000000000000000000" +
  "&device_fingerprint=00b139586f748ed2adf91b838d9f99c2";

const fetchSearchItem = ({ queryKey }) => {
  const itemNumber = queryKey[1];
  return fetch(itemSearchUrl(itemNumber)).then((res) => res.json());
};

function Project() {
  const [search, setSearch] = useQueryParam("search", StringParam, "");

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery(["project_items"], fetchItems, {
    enabled: !search,
    getNextPageParam: (lastPage, pages) => {
      const nextLink = lastPage.links.next;
      const query = nextLink.slice(nextLink.indexOf("?"));
      const params = new URLSearchParams(query);

      return params.get("page");
    },
  });

  const { data: searchedItem } = useQuery(
    ["project_item_search", search],
    fetchSearchItem,
    {
      enabled: !!search,
    }
  );

  const handleSearchInput = useCallback(
    (e) => {
      setSearch(e.target.value);
    },
    [setSearch]
  );

  return status === "loading" && !data ? (
    <p>Loading...</p>
  ) : status === "error" ? (
    <p>Error: {error.message}</p>
  ) : (
    <>
      <p>Project Address: {projectContractAddress}</p>

      <p>
        Search Item: <input value={search} onChange={handleSearchInput} />
      </p>

      {!!search && (
        <div>
          <div>{searchedItem?.name}</div>
          <img alt="searched_item" src={searchedItem?.imageUrl} />
        </div>
      )}

      {!search && (
        <>
          {data.pages.map((group, i) => (
            <React.Fragment key={i}>
              {group.items.map((project) => (
                <p key={project.uuid}>{project.name}</p>
              ))}
            </React.Fragment>
          ))}
          <div>
            <button
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
            >
              {isFetchingNextPage
                ? "Loading more..."
                : hasNextPage
                ? "Load More"
                : "Nothing more to load"}
            </button>
            &nbsp;
            <button>
              <Link to="/">Home</Link>
            </button>
          </div>
          <div>{isFetching && !isFetchingNextPage ? "Fetching..." : null}</div>
        </>
      )}
    </>
  );
}

export default Project;
