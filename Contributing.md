### How to contribute your code/work? 


- Clone the repository. 
```sh
git clone https://github.com/sam2127/AssignmentOrganizer.git
```

- Create a new local branch on your computer with a logical name for each new task you want to work on.

```sh
# Never make changes to the master/main branch directly.

git branch <branch name> # Create a new branch with <branch name>.

git checkout <branch name> # Checkout the newly created branch.
```


- When you have completed and tested your work in your local branch, then run `clean` script to clean the test data.

```sh
npm run clean
```


- To check the current status of changes in your local branch.
```sh
# None of the test data files should be listed in the output of this command. 
git status 
```


- Once you are ready to commit your changes to your local branch, add modified files to commit.
```sh
git add filename1 filename2 

# OR to add all the files in one go

git add *
```


- Commit the changes to your local branch. 

```sh
# Make sure your commit message is short and precise.
git commit -m "a short commit message"
```


- Push your local branch to GitHub.
```sh
# origin is the name assigned to GitHub remote.
git push origin <name of your local branch> 
```


- Login to your GitHub account using a browser. Locate the server copy of your branch using the `drop-down` or click on `Branches` link. 


- Create a pull request to merge your changes into the master/main branch. <br>
  Even if the GitHub is `Able to Merge` the changes, <b>do not merge with the master branch at this time</b>. 


- Once a pull request has been created your work/changes will be reviewed and either will be merged or you'll be given feedback to make changes before it can be merged into master branch. The review process can take a few days. 


- Once the pull request changes has been merged with the master then you can pull the changes from Github to your local repository and delete your branch at the remote server as well as in your local repository.
```sh
# It is a good practice to run git pull periodically to fetch the latest changes. 
git pull  
```


- <b> Remember to never make or merge changes to the master/main branch directly</b>. 


### Learning Resources 

- [A simple guide to git](https://rogerdudler.github.io/git-guide/).


- [Git cheat sheet](https://www.atlassian.com/git/tutorials/atlassian-git-cheatsheet)
