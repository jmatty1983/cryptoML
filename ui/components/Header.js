import { Navbar } from "react-bootstrap";

export default () => (
  <Navbar inverse collapseOnSelect>
    <Navbar.Header>
      <Navbar.Brand>
        <a href="#brand">NEATUI</a>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <NavItem eventKey={1} href="#">
          IMPORT
        </NavItem>
        <NavItem eventKey={2} href="#">
          GA
        </NavItem>
        <NavItem eventKey={2} href="#">
          CHARTS
        </NavItem>
        <NavItem eventKey={2} href="#">
          STATISTICS
        </NavItem>
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

/*<NavDropdown eventKey={3} title="Dropdown" id="basic-nav-dropdown">
        <MenuItem eventKey={3.1}>Action</MenuItem>
        <MenuItem eventKey={3.2}>Another action</MenuItem>
        <MenuItem eventKey={3.3}>Something else here</MenuItem>
        <MenuItem divider />
        <MenuItem eventKey={3.3}>Separated link</MenuItem>
      </NavDropdown*/
/*    <Nav pullRight>
      <NavItem eventKey={1} href="#">
        Link Right
      </NavItem>
      <NavItem eventKey={2} href="#">
        Link Right
      </NavItem>
    </Nav>*/
