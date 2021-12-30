import { API, Auth, graphqlOperation } from 'aws-amplify';
import React, { useState, useEffect } from 'react';
import { createPost } from '../graphql/mutations';
const CreatePost = () => {
    const [post, setPost] = useState({
        postOwnerId: '',
        postOwnerUsername: '',
        postTitle: '',
        postBody: ''
    });

    useEffect(() => {
        const auth = async() => {
            await Auth.currentUserInfo().then(user => {
                setPost({
                    ...post,
                    postOwnerId: user.attributes.sub,
                    postOwnerUsername: user.userName
                });
            })
        };
    }, []);

    const handleChange = (event) => {
        setPost({
            ...post,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const input = {
            postOwnerId: post.postOwnerId,
            postOwnerUsername: post.postOwnerUsername,
            postTitle: post.postTitle,
            postBody: post.postBody,
            createdAt: new Date().toISOString()
        };
        try {
            await API.graphql(graphqlOperation(createPost, {input}));
        } catch(error) {
            console.log("=====error====", error);
        }
        setPost({
            postTitle: '',
            postBody: ''
        });
    };

    return (
        <form className='add-post' onSubmit={handleSubmit}>
            <input stype={{ font: '19px'}}
                type='text'
                placeholder='postTitle'
                name='postTitle'
                required
                value={post.postTitle}
                onChange={handleChange}/>
            <textarea
                type='text'
                name='postBody'
                rows='3'
                cols='40'
                required
                placeholder='New blog post'
                value={post.postBody}
                onChange={handleChange} />
            <input type='submit'
                className='btn'
                style={{ fontSize: '19px'}}/>
        </form>
    );
};

export default CreatePost;