/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { Modal, Input, Button as CloseButton, Col, Row, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import { toastr } from 'react-redux-toastr';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import Box from './Box';
import CommentsContext from '../contexts/comments';
import ButtonCustom from '../components/ButtonCustom';
import UserName from './UserName';
import SelectUser from './SelectUser';
import { theme } from '../config';
import Loading from './loading';
import { Formik } from 'formik';
import AuthContext from '../contexts/auth';

const Comments = ({ personId = '', actionId = '' }) => {
  const [editingId, setEditing] = useState(null);
  const [clearNewCommentKey, setClearNewCommentKey] = useState(null);

  const commentsContext = useContext(CommentsContext);

  const comments = commentsContext.comments.filter((c) => {
    if (!!personId) return c.person === personId;
    if (!!actionId) return c.action === actionId;
    return false;
  });

  if (!comments) return null;

  const deleteData = async (id) => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await commentsContext.deleteComment(id);
      if (!res.ok) return;
      toastr.success('Suppression réussie');
    }
  };

  const addData = async ({ comment }) => {
    const commentBody = { comment };
    if (!!personId) {
      commentBody.item = personId;
      commentBody.person = personId;
      commentBody.type = 'person';
    }
    if (!!actionId) {
      commentBody.item = actionId;
      commentBody.action = actionId;
      commentBody.type = 'action';
    }
    const res = await commentsContext.addComment(commentBody);
    if (!res.ok) return;
    toastr.success('Commentaire ajouté !');
    setClearNewCommentKey((k) => k + 1);
  };

  const updateData = async (comment) => {
    const res = await commentsContext.updateComment(comment);
    if (!res.ok) return;
    toastr.success('Commentaire mis-à-jour');
    setEditing(null);
  };

  return (
    <React.Fragment>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col md={4}>
          <Title>Commentaires</Title>
        </Col>
      </Row>
      <Box>
        {!comments.length && !!commentsContext.loading ? (
          <Loading />
        ) : (
          <>
            <EditingComment key={clearNewCommentKey} onSubmit={addData} newComment />
            {comments.map((comment) => {
              return (
                <StyledComment key={comment._id}>
                  <CloseButton close onClick={() => deleteData(comment._id)} />
                  <UserName id={comment.user} wrapper={(name) => <div className="author">{name}</div>} />
                  <div className="user"></div>
                  <div className="time">{dayjs(comment.createdAt).format('MMM DD, YYYY | hh:mm A')}</div>
                  <div className="content">
                    <p onClick={() => setEditing(comment._id)}>
                      {comment.comment
                        ? comment.comment.split('\n').map((c, i, a) => {
                            if (i === a.length - 1) return <React.Fragment key={i}>{c}</React.Fragment>;
                            return (
                              <React.Fragment key={i}>
                                {c}
                                <br />
                              </React.Fragment>
                            );
                          })
                        : ''}
                    </p>
                  </div>
                </StyledComment>
              );
            })}
            {!!commentsContext.loading && <Loading />}
          </>
        )}
      </Box>
      <EditingComment
        commentId={editingId}
        value={comments.find((c) => c._id === editingId)}
        onSubmit={updateData}
        onCancel={() => setEditing(null)}
      />
    </React.Fragment>
  );
};

const EditingComment = ({ value = {}, commentId, onSubmit, onCancel, newComment }) => {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(commentId);
  }, [commentId]);

  const onCancelRequest = () => {
    setOpen(false);
    if (onCancel) onCancel();
  };

  return (
    <>
      {!!newComment && <ButtonCustom title="Ajouter un commentaire" onClick={() => setOpen(true)} style={{ marginBottom: 20 }} />}
      <Modal isOpen={!!open} toggle={onCancelRequest} size="lg">
        <ModalHeader toggle={onCancelRequest}>{newComment ? 'Créér un' : 'Éditer le'} commentaire</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={value}
            onSubmit={async (body, actions) => {
              if (!body.user && !newComment) return toastr.error('Erreur!', "L'utilisateur est obligatoire");
              if (!body.createdAt && !newComment) return toastr.error('Erreur!', 'La date est obligatoire');
              if (!body.comment) return toastr.error('Erreur!', 'Le commentaire suivie est obligatoire');
              await onSubmit({ ...value, ...body });
              actions.setSubmitting(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  {!newComment && (
                    <>
                      <Col md={6}>
                        <FormGroup>
                          <Label>Créé par</Label>
                          <SelectUser
                            isDisabled={newComment}
                            value={values.user || user._id}
                            onChange={(userId) => handleChange({ target: { value: userId, name: 'user' } })}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label>Créé le</Label>
                          <div>
                            <DatePicker
                              locale="fr"
                              className="form-control"
                              selected={values.createdAt ? new Date(values.createdAt) : new Date()}
                              onChange={(date) => handleChange({ target: { value: date, name: 'createdAt' } })}
                              timeInputLabel="Time:"
                              dateFormat="dd/MM/yyyy HH:mm"
                              showTimeInput
                            />
                          </div>
                        </FormGroup>
                      </Col>
                    </>
                  )}
                  <Col md={12}>
                    <FormGroup>
                      <Label>Commentaire</Label>
                      <Input name="comment" type="textarea" value={values.comment} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom
                  type="submit"
                  color="info"
                  disabled={isSubmitting}
                  onClick={() => !isSubmitting && handleSubmit()}
                  title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </>
  );
};

const Title = styled.h1`
  font-size: 20px;
  font-weight: 800;
`;

const StyledComment = styled.div`
  padding: 16px 0;
  border-top: 1px solid #cacaca;
  /* display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid #000; */
  .author {
    font-weight: bold;
    color: ${theme.main};
  }
  .content {
    padding-top: 8px;
    font-style: italic;
    &:hover {
      cursor: pointer;
    }
  }
  .time {
    font-size: 10px;
    color: #9b9999;
    font-style: italic;
  }
  .user {
    width: 50%;
  }
`;

export default Comments;