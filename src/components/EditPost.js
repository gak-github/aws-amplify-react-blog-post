import React, { useState, useEffect } from 'react';
import { Auth, API, graphqlOperation } from 'aws-amplify'
import { updatePost } from '../graphql/mutations'

const EditPost = ({post}) => {
    const [state, setState] = useState({
        show: false,
        id: "",
        postOwnerId: "",
        postOwnerUsername: "",
        postTitle: "",
        postBody: "",
        postData: {
             postTitle: post.postTitle,
             postBody: post.postBody
        }
    });

    const handleModal = () => {
        setState({ ...state, show: !state.show})
        document.body.scrollTop = 0
        document.documentElement.scrollTop = 0
    };
   
    const handleUpdatePost = async (event) => {
        event.preventDefault()
        const input = {
             id: post.id,
             postOwnerId: state.postOwnerId,
             postOwnerUsername: state.postOwnerUsername,
             postTitle: state.postData.postTitle,
             postBody: state.postData.postBody
   
        }
        await API.graphql(graphqlOperation(updatePost, { input }))
   
        //force close the modal 
        setState({ ...state, show: !state.show})
   
    };
    
    const handleTitle = event => {
        setState({
            ...state,
            postData: {...state.postData, postTitle: event.target.value}
             
        })
    };

    const handleBody = event => {
        setState({ ...state, postData: {...state.postData,
         postBody: event.target.value}})
    };

    useEffect(() => {
        const getCurrentUserInfo = async () => {
            await Auth.currentUserInfo()
                .then(user => {
                    setState({
                        ...state,
                        postOwnerId: user.attributes.sub,
                        postOwnerUsername: user.username 
                    })
                });
        };
        getCurrentUserInfo();
    }, []);

    return (
        <>
        { state.show && (
            <div className="modal">
                 <button className="close"
                    onClick={handleModal}>
                     X
                 </button>

                 <form className="add-post"
                    onSubmit={(event) => handleUpdatePost(event)}>

                        <input style={{fontSize: "19px"}}
                             type="text" placeholder="Title"
                             name="postTitle"
                             value={state.postData.postTitle}
                             onChange={handleTitle} />

                        <input 
                           style={{height: "150px", fontSize: "19px"}}
                           type="text"
                           name="postBody"
                           value={state.postData.postBody}
                           onChange={handleBody}
                           />
                        <button>Update Post</button>
                 </form>        
            </div>
        )
        }      
           <button onClick={handleModal}>Edit</button>
        </>  
    )
};

export default EditPost;