import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAsk, startDiscussion } from '@/store/slices/askSlice';
import { AskPlace } from '@/services/api/endpoints/ask';
import AskForm from './AskForm';
import { ASK_PATH, askState } from './askRoute';

interface PlaceAskProps {
  place: AskPlace;
  /** The place's short name, for the field's label: "Concord" */
  title: string;
}

/**
 * The question field on a district's or school's overview. Asking starts a new discussion on the
 * Ask page about this place, where a question that names no place is about it.
 */
const PlaceAsk: React.FC<PlaceAskProps> = ({ place, title }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // The Take More Time switch is shared with the Ask page
  const { moreTime } = useAppSelector(selectAsk);
  const askFresh = (question: string) => {
    dispatch(startDiscussion(place));
    navigate(ASK_PATH, askState(question, [], moreTime, place));
  };

  return (
    <AskForm
      id="place-question"
      label={`Your question about ${title}`}
      onAsk={askFresh}
      hint={false}
      placeholder="Example: How has enrollment changed?"
      showExample
      quiet
    />
  );
};

export default PlaceAsk;
