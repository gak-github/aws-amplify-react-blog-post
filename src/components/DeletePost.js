import { API, graphqlOperation } from 'aws-amplify';
import React from 'react';
import { deletePost } from '../graphql/mutations';

const handleDelete = async (id) => {
    const input = { id };
    await API.graphql(graphqlOperation(deletePost, {input}))
};
const DeletePost = ({post}) => {
    return (
        <button onClick= {()=> handleDelete(post.id)}> Delete </button>
    )
};

export default DeletePost;