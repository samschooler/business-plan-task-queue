## Create a trigger on creation in the `plan` table, call add_job from graphile-worker

```sql
CREATE OR REPLACE FUNCTION plan_created() RETURNS trigger AS $$
BEGIN
  PERFORM graphile_worker.add_job(
    'plan-created',
    payload := json_build_object(
      'short_code', NEW.short_code
    ),
    job_key := 'plan-' || NEW.short_code
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE TRIGGER plan_created_trigger AFTER INSERT ON public.plan FOR EACH ROW EXECUTE PROCEDURE plan_created();

ALTER FUNCTION plan_created() SECURITY DEFINER SET search_path = graphile_worker;
```

# Short codes

add extension `pg_hashids`

```sql
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.short_code := id_encode(NEW.id, '4t435grhsdeweqf', 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_generate_short_code
BEFORE INSERT ON plan
FOR EACH ROW
EXECUTE FUNCTION generate_short_code();
```
