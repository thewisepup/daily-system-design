export interface FeedbackFormProps {
  handleSubmit: () => void;
  setFeedback: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
export function FeedbackForm({ handleSubmit, setFeedback }: FeedbackFormProps) {
  return (
    <div>
      <input onChange={(e) => setFeedback(e)} placeholder="Feedback"></input>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
