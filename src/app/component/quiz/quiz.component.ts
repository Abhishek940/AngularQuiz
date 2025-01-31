import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { QuizService } from '../../service/quiz.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { interval } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { Question } from '../../models/question.model';

@Component({
  selector: 'app-quiz',
  standalone: false,
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
})
export class QuizComponent implements OnInit {
  quizForm!: FormGroup;
  questions: Question[] = [];
  currentQuestion = 0;
  isLoading = true;
  results: any[] = [];
  quizResults: any = [];
  isSubmitted = false;
  displayedColumns: string[] = [
    'id',
    'selectedAnswer',
    'correctAnswer',
    'Result',
  ];

  displayedResultColumns: string[] = [
    'totalQuestions',
    'correctAnswers',
    'incorrectAnswers',
    'totalScore',
    'scorePercentage',
  ];

  displayedResultDetailsColumns: string[] = [
    'question',
    'correctAnswer',
    'userAnswer',
    'result',
  ];

  dataSource = new MatTableDataSource<any>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  pageSize: number = 5;
  pageSizeOptions: number[] = [5, 10, 20];
  // Timer
  timer: string = '10:00'; // Timer in mm:ss format
  totalTime: number = 600; // Set the total time in seconds (600 = 10 minutes)
  timerSubscription: any;
  totalScore: any;

  constructor(private quizService: QuizService, private fb: FormBuilder) {}

  ngOnInit() {
    this.quizService.getQuestions().subscribe({
      next: (data) => {
        this.questions = data.quiz;
        this.isLoading = false;
        console.log('questions:', this.questions);
        this.createQuestion();
      },
      error: () => {
        this.isLoading = false;
      },
    });

    this.quizForm = this.fb.group({
      questions: this.fb.array([]),
    });
    this.startTimer();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // Start timer
  startTimer() {
    this.timerSubscription = interval(1000) //1 sec
      .pipe(
        takeWhile(() => this.totalTime > 0),
        map(() => {
          this.totalTime--;
          this.updateTimerDisplay();
        })
      )
      .subscribe();
  }

  // Update timer display in mm:ss format
  updateTimerDisplay() {
    const minutes = Math.floor(this.totalTime / 60);
    const seconds = this.totalTime % 60;
    // Format to mm:ss
    this.timer = `${this.formatTime(minutes)}:${this.formatTime(seconds)}`;
  }

  formatTime(time: number) {
    return time < 10 ? `0${time}` : `${time}`;
  }

  // Stop the timer
  stopTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
  // Create form controls dynamically for each question
  createQuestion() {
    const questionFormArray = this.quizForm.get('questions') as FormArray;
    this.questions.forEach((question) => {
      questionFormArray.push(
        this.fb.group({
          id: [question.id],
          selectedOption: [''],
        })
      );
    });
  }

  // Get the FormControl for the current question from the FormArray
  currentQuestionControl(): any {
    const questionFormArray = this.quizForm.get('questions') as FormArray;
    return questionFormArray.at(this.currentQuestion);
  }

  // Get the current question
  currentQuestions(): Question | null {
    return this.questions.length > 0 ? this.questions[this.currentQuestion]: null;
  }

  //  next question
  nextQuestion() {
    if (this.currentQuestion < this.questions.length - 1) {
      this.currentQuestion++;
    } else {
      this.submitQuiz();
    }
  }

  //  previous question
  previousQuestion(): void {
    if (this.currentQuestion > 0) {
      this.currentQuestion--;
    }
  }

  saveUserAnswersAndReview() {
    const userAnswers = this.quizForm.value.questions;
    this.quizService.saveUserAnswers(userAnswers);
    this.reviewAnswers();
  }

  reviewAnswers() {
    this.quizService.compareAnswers().subscribe((response) => {
      if (response.results) {
        this.dataSource.data = response.results;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    });
  }

  submitQuiz() {
    if (this.quizForm.valid) {
      const userAnswers = this.quizForm.value.questions;
      const correctAnswers = this.calculateCorrectAnswers(userAnswers);
      this.quizService.saveUserAnswers(userAnswers);

      // Store results
      this.quizResults = {
        totalQuestions: this.questions.length,
        correctAnswers: correctAnswers,
        userAnswers: userAnswers,
      };
      this.isSubmitted = true;
      alert('Quiz submitted!');
      this.stopTimer();
    }
   
  }

  calculateCorrectAnswers(userAnswers: any[]): number {
    let correctCount = 0;
    this.questions.forEach((question, result) => {
      if (userAnswers[result]?.selectedOption === question.answer) {
        correctCount++;
      }
    });
    return correctCount;
  }

}
