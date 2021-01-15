import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppService } from '../app.service';
import { LoginService } from '../login.service';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit {

  form: FormGroup
  remainingText = 3000

  constructor(private fb: FormBuilder, private loginSvc: LoginService, private appSvc: AppService, private router: Router) { }

  ngOnInit(): void {

    this.form = this.fb.group({
      comments: this.fb.control('', [Validators.required])
    })

  }

  valueChange() {
    if(this.form.get('comments').value != null)
      this.remainingText = this.remainingText - this.form.get('comments').value.length
  }

   clear() {
     this.form.reset()  
     this.remainingText = 3000
   }

   submit() {
      //submit feedback
      const formData = new FormData()
      formData.set('user', this.loginSvc.getUser())
      formData.set('comments', this.form.get('comments').value)
      const payload = { user: this.loginSvc.getUser(), comments: this.form.get('comments').value}
      console.info('payload: ', payload)

      //this.appSvc.sendFeedback(formData)
      this.appSvc.sendFeedback(payload)
      .subscribe(response => {
        this.clear()
        console.log('Feedback successfully sent')
        alert("Feedback successfully sent")
        this.router.navigate(['/menu'])
      }, e => {
        console.error(e)
        if (e.status.toString() == '401') {
          console.log('Feedback submission failed')
          this.router.navigate(['/'])
        }
      })

   }
}
