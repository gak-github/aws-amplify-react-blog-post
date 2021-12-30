import React, { useState, useEffect } from 'react';
import { listPosts } from '../graphql/queries';
import { API, graphqlOperation } from 'aws-amplify';
import DeletePost from './DeletePost';
import EditPost from './EditPost';
import { onCreatePost, onDeletePost, onUpdatePost, onCreateComment, onCreateLike } from '../graphql/subscriptions';
import CreateCommentPost from './CreateCommentPost';
import CommentPost from './CommentPost';
import { createLike } from '../graphql/mutations';
import { FaThumbsUp, FaSadTear } from 'react-icons/fa';
import {Auth} from 'aws-amplify'
import UsersWhoLikedPost from './UsersWhoLikedPost'

const DisplayPosts = () => {
    const [state, setState] = useState({
        ownerId:"",
        ownerUsername:"",
        errorMessage: "",
        postLikedBy: [],
        isHovering: false,
        posts: []
    });
    
    useEffect(() => {
        const getPosts = async() => {
            const result = await API.graphql(graphqlOperation(listPosts));
            setState({...state, posts: result?.data?.listPosts?.items});
        };
        const getCurrentUserInfo = async() => {
            await Auth.currentUserInfo()
            .then(user => {
                setState({
                    ...state,
                    ownerId: user.attributes.sub,
                    ownerUsername: user.username,
                });
            });
        };
        getPosts();
        getCurrentUserInfo();
        const createPostListener = API.graphql(graphqlOperation(onCreatePost)).subscribe({
            next: postData => {
                const newPost = postData.value.data.onCreatePost;
                const prevPost = state.posts.filter(post => {
                    return post.id !== newPost.id
                });
                const updatedPost = [newPost, ...prevPost];
                setState({...state, posts: updatedPost });
            }
        });

        const deletePostListener = API.graphql(graphqlOperation(onDeletePost)).subscribe({
            next: deleteData => {
                const deletedPost = deleteData.value.data.onDeletePost;
                const updatedPost = state.posts.filter(post => {
                    return post.id !== deletedPost.id;
                });
                setState({...state, posts: updatedPost });
            }
        });

        const updatePostListener = API.graphql(graphqlOperation(onUpdatePost))
            .subscribe({
                next: postData => {
                    const { posts } = state
                    const updatePost = postData.value.data.onUpdatePost
                    const index = posts.findIndex(post => post.id === updatePost.id) //had forgotten to say updatePost.id!
                    const updatePosts = [
                        ...posts.slice(0, index),
                        updatePost,
                        ...posts.slice(index + 1)
                    ]

                    setState({ ...state, posts: updatePosts})

                }
            });
        const createPostCommentListener = API.graphql(graphqlOperation(onCreateComment))
            .subscribe({
                 next: commentData => {
                      const createdComment = commentData.value.data.onCreateComment
                      let posts = [ ...state.posts]

                      for (let post of posts ) {
                           if ( createdComment.post.id === post.id) {
                                post?.comments?.items?.push(createdComment)
                           }
                      }
                      setState({ ...state, posts})
                 }
            });
        const createPostLikeListener = API.graphql(graphqlOperation(onCreateLike))
            .subscribe({
                next: postData => {
                    const createdLike = postData.value.data.onCreateLike;

                    let posts = [...state.posts];
                    for (let post of posts ) {
                        if (createdLike.post.id === post.id) {
                                post.likes.items.push(createdLike);
                        }
                    }
                    setState({ ...state, posts }); 
                }
            });

        const cleanup = () => {
            createPostListener.unsubscribe();
            deletePostListener.unsubscribe();
            updatePostListener.unsubscribe();
            createPostCommentListener.unsubscribe();
            createPostLikeListener.unsubscribe();
        }
        return cleanup;
    }, []);
    
    const likedPost = (postId) =>  {      
        for (let post of state.posts) {
              if ( post.id === postId ) {
                   if ( post.postOwnerId === state.ownerId) return true;
                    for (let like of post.likes.items) {
                        if (like.likeOwnerId === state.ownerId) {
                            return true;
                        }
                    }
              }
        }
        return false;
    };

    const handleLike = async postId => {
         if (likedPost(postId)) {
             return setState({...state, errorMessage: "Can't Like Your Own Post."})
        } else {
            const input = {
                numberLikes: 1,
                likeOwnerId: state.ownerId,
                likeOwnerUsername: state.ownerUsername,
                likePostId: postId
            }
            try {
                const result =  await API.graphql(graphqlOperation(createLike, { input }))
    
                console.log("Liked: ", result.data);
                
            }catch (error) {
                console.error(error)                       
            }
        }
    };

    const handleMouseHover = async postId => {
         setState({...state, isHovering: !state.isHovering})

         let innerLikes = state.postLikedBy

         for (let post of state.posts) {
              if (post.id === postId) {
                   for ( let like of post.likes.items) {
                         innerLikes.push(like.likeOwnerUsername);
                   }
              }
              setState({...state, postLikedBy: innerLikes});
         }
          console.log("Post liked by: ", state.postLikedBy);     
    };

    const handleMouseHoverLeave = async () => {
            setState({...state, isHovering: !state.isHovering});
            setState({...state, postLikedBy: []});
    };

    const { posts } = state;  
    let loggedInUser = state.ownerId
    
    return posts.map(( post ) => {
        return (
            <div className="posts"  style={rowStyle} key={ post.id}> 
                <h1> { post.postTitle }</h1>
                <span style={{ fontStyle: "italic", color: "#0ca5e297"  }}> 
                    { "Wrote by: " } { post.postOwnerUsername}
                    {" on "} 
                    <time style={{ fontStyle: "italic" }}>
                            {" "}
                            { new Date(post.createdAt).toDateString()} 
                    </time>
                </span>

                <p> { post.postBody }</p>
                <br />
                <span>
                    {post.postOwnerId === loggedInUser &&
                        <DeletePost post={post}/>
                    }
                    { post.postOwnerId === loggedInUser &&
                        <EditPost post={post} />
                    }
                    <span>
                        <p className="alert">{ post.postOwnerId === loggedInUser && state.errorMessage}</p>
                        <p onMouseEnter={ () => handleMouseHover(post.id)}
                            onMouseLeave={ () => handleMouseHoverLeave()}
                            onClick={() => handleLike(post.id)}
                            style={{color: (post.likes.items && post.likes.items.length > 0) ? "blue": "gray"}}
                            className="like-button"> 
                        <FaThumbsUp /> 
                        {post.likes.items && post.likes.items.length}
                        </p>
                        {
                            state.isHovering &&
                            <div className="users-liked">
                                    {state.postLikedBy.length === 0 ? 
                                        " Liked by No one " : "Liked by: " }
                                    {state.postLikedBy.length === 0 ? <FaSadTear /> : <UsersWhoLikedPost data={state.postLikedBy} /> }

                            </div>
                        }
                    </span>
                </span>
                <span>
                    <CreateCommentPost postId={post.id} />
                    { post.comments.items && post.comments.items.length > 0 && <span style={{fontSize:"19px", color:"gray"}}>
                        Comments: </span>}
                        {
                            post.comments.items && post.comments.items.map((comment, index) => <CommentPost key={index} commentData={comment}/>)
                        }
                </span>
            </div>
        )
    });
};

const rowStyle = {
    background: '#f4f4f4',
    padding: '10px',
    border: '1px #ccc dotted',
    margin: '14px'
};

export default DisplayPosts;