# TrailsRegistry

Trails is a contract closely used with Arweave on the front end.
It's purpose is to save a unique identifier (trail) and add content to it, (arweave transaction ids), so data that is related can be displayed on the front end easily.
The Trails smart contract implements private trails that only the creator can modify.
Public trails data is posted and fetched from Arweave and the creator can black list transactions via this smart contract if he wants to hide something from appearing on the front end.

## External functions

    function newTrail(string memory _trailId_,uint8 access) external;

Create a new trail, the trailId must be unique, if the access is private, it's 0, if public it has to be 1.

    function add(string memory _trailId_, string memory data) external;

Add content to the trail, the ${data} is an arweave transaction id;

    function remove(string memory _trailId_, uint256 _contentIndex_) external;

Remove the data from a trail at the index;

    function blackList(string memory _trailId_, string memory data) external;

You can blacklist transaction ids if the trail is PUBLIC, so they don't show on the front end. Blacklist is a string[], accessed with the _trailId_

## View functions

    function getBlackList(string memory _trailId_)
    	external
    	view
    	returns (string[] memory);

Returns the blacklisted transaction ids for the trail

    function getTrailDetails(string memory _trailId_)
    	external
    	view
    	returns (TrailDetails memory);

Returns the details of the trail, but not the content.

    	struct TrailDetails {

    	    	address creator;
    	    	uint256 contentIndex;
    	    	bool initialized;
           	uint8 access;
    }

The TrailDetails object defines the creator, the contentIndex is the index of the latest content added, initialized is true if the trailDetails exists.
Access is 0 if the access is private , if it's 1, then it's public.
Private means, the arweave comments are not fetched on the front end for the trail.

    	function getTrailContent(string memory _trailId_, uint256 _contentIndex_)
    	external
    	view
    	returns (string memory);

You can get the content at an index via this function.

    function getTrailPaginated(
    	string memory _trailId_,
    	uint256 _first_,
    	uint256 _second_,
    	uint256 _third_,
    	uint256 _fourth_,
    	uint256 _fifth_
    )
    	external
    	view
    	returns (
    	string memory,
    	string memory,
    	string memory,
    	string memory,
    	string memory
    	)

Get 5 ArweaveTxIds from the contents, not only one. Used with pagination.
