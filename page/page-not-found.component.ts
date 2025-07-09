import { Component } from '@angular/core';

@Component({
  selector: 'hfw-page-not-found',
  template: `
    <div style="text-align:center">
      <h1>
        404
      </h1>
      <div class="container">
        <h3>The page you're looking for could not be found.</h3>
        <hr />
        <p>Make sure the address is correct and that the page hasn't moved.</p>
        <p>Please contact your administrator if you think this is a mistake.</p>
        <a href="javascript:history.back()">Go to homepage</a>
      </div>
    </div>
  `,
  standalone: false
})

export class PageNotFoundComponent {
}
