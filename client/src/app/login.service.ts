import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";

@Injectable()
export class LoginService {

private token = ''
apiUrl = 'http://localhost:3000'
user = ''

constructor(private http: HttpClient, private router: Router) {}

checkLogin(p: FormData): Promise<boolean> {
    //call to backend
    //examine status code (200 true, 401 false)
    return this.http.post<any>(`${this.apiUrl}/login`, p, {observe: 'response'})
    .toPromise()
    .then(resp => {
        if(resp.status == 200) {
            this.token = resp.body.token
            this.user = resp.body.user
        }
        console.info('resp: ', resp)
        return true
    }).catch(err => {
        if (err.status == 401) {
         //handle error   
        }
        console.info('err: ', err)
        return false
    })
}

getUser() {
    return this.user
}

logout() {
    this.user = ''
    this.token = ''
}

isLogin() {
    return this.token !=''
}

canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.isLogin())
        return true
    return this.router.parseUrl('/login') 
}

}