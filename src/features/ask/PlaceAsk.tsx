import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearTurns, selectAsk } from '@/store/slices/askSlice';
import { AskPlace } from '@/services/api/endpoints/ask';
import AskForm from './AskForm';
import { PLACE_EXAMPLE_QUESTION } from './askCopy';
import { askPathFor, askState } from './askRoute';
import { usePlaceExamples } from './usePlaceExamples';

// Questions short enough to sit on one line in the field beside the title, after "Try: "
const FITS_ON_ONE_LINE = 48;

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
  // One of the place's own examples, mostly what its pages don't show, a different one each visit; the
  // general one if none fits. The same words as on its Ask page, so a saved answer can serve it.
  const examples = usePlaceExamples(place).filter(question => question.length <= FITS_ON_ONE_LINE);
  const [pick] = useState(Math.random);
  const example = examples.length ? examples[Math.floor(pick * examples.length)] : PLACE_EXAMPLE_QUESTION;
  const askFresh = (question: string) => {
    dispatch(clearTurns());
    navigate(askPathFor(place), askState(question, [], moreTime));
  };

  return (
    <AskForm
      id="place-question"
      // Beside the title it has no heading of its own, so the label says what it's for
      label={inline ? `Ask a question about ${title}` : `Your question about ${title}`}
      onAsk={askFresh}
      placeholder={`Try: ${example}`}
      showExample
      // Asking with the field empty asks the example: a first try in one click
      emptyQuestion={example}
      inline={inline}
    />
  );
};

export default PlaceAsk;
