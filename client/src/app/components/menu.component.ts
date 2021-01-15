import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../login.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  constructor(private loginSvc: LoginService, private router: Router) { }

  ngOnInit(): void {
  }

  logout(){
    if (confirm("Confirm logout?")){
      this.loginSvc.logout()
      this.router.navigate(['/login'])
    }
  }

}
