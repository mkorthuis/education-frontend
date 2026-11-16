import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearTurns, selectAsk } from '@/store/slices/askSlice';
import { AskPlace } from '@/services/api/endpoints/ask';
import AskForm from './AskForm';
import { PLACE_EXAMPLE } from './askCopy';
import { askPathFor, askState } from './askRoute';

interface PlaceAskProps {
  place: AskPlace;
  /** The place's short name, for the field's label: "Concord" */
  title: string;
  /** One line, the button beside the field, as beside the place's title on wide screens */
  inline?: boolean;
}

/**
 * The question field on a district's or school's overview. Asking starts a new discussion on the
 * place's own Ask page (/district/111/ask), where a question that names no place is about it.
 */
const PlaceAsk: React.FC<PlaceAskProps> = ({ place, title, inline = false }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // The Take More Time switch is shared with the Ask page
  const { moreTime } = useAppSelector(selectAsk);
  const askFresh = (question: string) => {
    dispatch(clearTurns());
    navigate(askPathFor(place), askState(question, [], moreTime));
  };

  return (
    <AskForm
      id="place-question"
      // Beside the title it has no heading of its own, so the label says what it's for
      label={inline ? `Ask about ${title}` : `Your question about ${title}`}
      onAsk={askFresh}
      hint={false}
      placeholder={PLACE_EXAMPLE}
      showExample
      inline={inline}
    />
  );
};

export default PlaceAsk;
