// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SocialNetwork {
    string public name = "Social Network YJS";
    uint public postCount = 0;
    uint public commentCount = 0;

    struct Post {
        uint id;
        string content;
        uint tipAmount;
        address payable author;
        uint likeCount;
    }

    struct Comment {
        uint id;
        uint postId;
        string content;
        address author;
    }

    mapping(uint => Post) public posts;
    mapping(uint => Comment[]) public comments; // postId => comments

    // чтобы нельзя было лайкать несколько раз
    mapping(uint => mapping(address => bool)) public liked;

    event PostCreated(
        uint id,
        string content,
        uint tipAmount,
        address author
    );

    event PostTipped(
        uint id,
        uint tipAmount,
        address author
    );

    event PostLiked(
        uint id,
        address user,
        uint likeCount
    );

    event CommentAdded(
        uint id,
        uint postId,
        string content,
        address author
    );

    // 📌 Создание поста
    function createPost(string memory _content) public {
        require(bytes(_content).length > 0, "Empty content");

        postCount++;

        posts[postCount] = Post({
            id: postCount,
            content: _content,
            tipAmount: 0,
            author: payable(msg.sender),
            likeCount: 0
        });

        emit PostCreated(postCount, _content, 0, msg.sender);
    }

    // 💸 Донат автору
    function tipPost(uint _id) public payable {
        require(_id > 0 && _id <= postCount, "Invalid ID");

        Post storage _post = posts[_id];

        (bool success, ) = _post.author.call{value: msg.value}("");
        require(success, "Transfer failed");

        _post.tipAmount += msg.value;

        emit PostTipped(_id, _post.tipAmount, _post.author);
    }

    // ❤️ Лайк поста
    function likePost(uint _id) public {
        require(_id > 0 && _id <= postCount, "Invalid ID");
        require(!liked[_id][msg.sender], "Already liked");

        Post storage _post = posts[_id];

        _post.likeCount++;
        liked[_id][msg.sender] = true;

        emit PostLiked(_id, msg.sender, _post.likeCount);
    }

    // 💬 Добавить комментарий
    function addComment(uint _postId, string memory _content) public {
        require(_postId > 0 && _postId <= postCount, "Invalid post");
        require(bytes(_content).length > 0, "Empty comment");

        commentCount++;

        comments[_postId].push(Comment({
            id: commentCount,
            postId: _postId,
            content: _content,
            author: msg.sender
        }));

        emit CommentAdded(commentCount, _postId, _content, msg.sender);
    }

    // 📖 Получить количество комментариев у поста
    function getCommentCount(uint _postId) public view returns (uint) {
        return comments[_postId].length;
    }
}