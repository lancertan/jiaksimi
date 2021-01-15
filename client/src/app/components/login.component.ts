import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form: FormGroup

  errorMessage = ''

  constructor(private fb: FormBuilder, private loginSvc: LoginService, private router: Router) { }

  ngOnInit(): void {

    this.form = this.fb.group({
      username: this.fb.control('', [Validators.required]),
      password: this.fb.control('', [Validators.required])
    })

  }

  login() {
    this.loginSvc.checkLogin(this.form.value)
      .then(result => {
        console.info('>>result: ', result)
        if (result)
          this.router.navigate(['/menu'])
        else {
          this.errorMessage = 'Login unsuccessful, please check username or password'
        }

      })
    /*.subscribe(resp => {
        if(resp.authenticated){
          console.log('Login success')
          //navigate to main
        }
      }, err => {
        console.log('Login fail')
        this.errorMessage = 'Login unsuccessful, please check username or password'
      })*/
  }
}
