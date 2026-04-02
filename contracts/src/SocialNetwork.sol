// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SocialNetwork {
    string public name = "Social Network YJS";
    uint public postCount = 0;
    uint public commentCount = 0;

    struct Post {
        uint id;
        string content;
        string imageHash;  // Добавлено поле для хеша изображения
        uint tipAmount;
        address payable author;
        uint likeCount;
    }

    struct Comment {
        uint id;
        uint postId;
        string content;
        address author;
        uint timestamp;  // Добавлена временная метка
    }

    mapping(uint => Post) public posts;
    mapping(uint => Comment[]) public comments;
    mapping(uint => mapping(address => bool)) public liked;
    mapping(uint => mapping(address => bool)) public commentLiked; // Лайки комментариев

    event PostCreated(
        uint id,
        string content,
        string imageHash,
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
        address author,
        uint timestamp
    );

    // 📌 Создание поста с изображением
    function createPost(string memory _content, string memory _imageHash) public {
        require(bytes(_content).length > 0 || bytes(_imageHash).length > 0, "Content or image required");

        postCount++;

        posts[postCount] = Post({
            id: postCount,
            content: _content,
            imageHash: _imageHash,
            tipAmount: 0,
            author: payable(msg.sender),
            likeCount: 0
        });

        emit PostCreated(postCount, _content, _imageHash, 0, msg.sender);
    }

    // 💸 Донат автору
    function tipPost(uint _id) public payable {
        require(_id > 0 && _id <= postCount, "Invalid ID");

        Post storage _post = posts[_id];
        require(_post.author != address(0), "Invalid author");

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
        require(bytes(_content).length <= 500, "Comment too long");

        commentCount++;

        comments[_postId].push(Comment({
            id: commentCount,
            postId: _postId,
            content: _content,
            author: msg.sender,
            timestamp: block.timestamp
        }));

        emit CommentAdded(commentCount, _postId, _content, msg.sender, block.timestamp);
    }

    // 📖 Получить количество комментариев у поста
    function getCommentCount(uint _postId) public view returns (uint) {
        return comments[_postId].length;
    }

    // 📖 Получить все комментарии поста
    function getComments(uint _postId) public view returns (Comment[] memory) {
        return comments[_postId];
    }

    // 📖 Получить изображение поста
    function getPostImage(uint _postId) public view returns (string memory) {
        require(_postId > 0 && _postId <= postCount, "Invalid ID");
        return posts[_postId].imageHash;
    }
}