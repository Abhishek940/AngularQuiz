import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = 'assets/quiz.json'; 
  private answerUrl = 'assets/answer.json'; 
  private localStorageKey = 'userAnswers'; 

  constructor(private http: HttpClient) {}

  // Fetch questions from quiz.json
  getQuestions(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Save user's answers in LocalStorage
  saveUserAnswers(answers: any): void {
     localStorage.setItem(this.localStorageKey, JSON.stringify(answers));
  }

  // Fetch user's answers from LocalStorage
  getUserAnswers(): any {
    return JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
  }

  // Fetch correct answers from answer.json
  getCorrectAnswers(): Observable<any> {
    return this.http.get(this.answerUrl);
  }
  

  // Compare user answers with correct answers
 compareAnswers(): Observable<any> {
  const userAnswers = this.getUserAnswers();
  if (!userAnswers.length) {
    return of({ message: 'No answers found in LocalStorage.' });
  }

  return this.getCorrectAnswers().pipe(
    map(correctData => {
      if (!correctData) 
        return {
          message: 'Error fetching correct answers.'
       };
      const correctAnswers = correctData.answers;
      // Compare answers
      const result = userAnswers.map((userAnswer: any) => {
        const correct = correctAnswers.find((ans: any) => ans.id === userAnswer.id);
        return {
          id: userAnswer.id,
          selectedAnswer: Number(userAnswer.selectedOption), 
          correctAnswer: correct ? Number(correct.correctAnswer) : null, 
          isCorrect: correct ? Number(userAnswer.selectedOption) === Number(correct.correctAnswer) : false
        };
      });

       return { results: result };
    })
  );
}

}
