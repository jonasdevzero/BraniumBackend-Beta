import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity("pre_registration")
export default class PreRegistration extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    pending: boolean;
}
