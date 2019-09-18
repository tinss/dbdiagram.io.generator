# Help gen code from dbdiagram.io schema

## To gen CSharp model classes

```
node csharp/models.js {project_folder_name} {id}
```

Ex: https://dbdiagram.io/d/5d6f36d3ced98361d6de2d93

5d6f36d3ced98361d6de2d93 is id


```
node csharp/models.js Carkiosk 5d6f36d3ced98361d6de2d93
```

results will be in ./csharp/{project_folder_name}/results/
